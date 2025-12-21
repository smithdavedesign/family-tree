FROM eclipse-temurin:17-jre

WORKDIR /photon

# Download latest Photon release
ADD https://github.com/komoot/photon/releases/download/0.3.5/photon-0.3.5.jar /photon/photon.jar

# Create data directory
RUN mkdir -p /photon/photon_data

VOLUME /photon/photon_data
EXPOSE 2322

ENTRYPOINT ["java", "-jar", "/photon/photon.jar"]
CMD ["-data-dir", "/photon/photon_data"]
